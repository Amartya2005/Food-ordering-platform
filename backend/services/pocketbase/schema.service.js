const env = require('../../config/env');
const { getPocketBase } = require('../../config/pocketbase');
const {
  COLLECTION_SCHEMAS,
  toPocketBaseCollectionPayload,
} = require('../../config/collections');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');

const SCHEMA_RULE_KEYS = [
  'listRule',
  'viewRule',
  'createRule',
  'updateRule',
  'deleteRule',
  'manageRule',
  'authRule',
];

const clone = (value) => {
  return JSON.parse(JSON.stringify(value));
};

const getIndexName = (index) => {
  const match = index.match(/INDEX\s+[`"]?([^`"\s]+)/i);
  return match ? match[1] : index;
};

const sortValues = (values) => {
  return [...values].sort();
};

class PocketBaseSchemaService {
  get client() {
    return getPocketBase();
  }

  getExpectedSchemas() {
    return COLLECTION_SCHEMAS;
  }

  async authenticateSuperuser() {
    if (this.client.authStore.isValid) {
      return this.client.authStore.model;
    }

    if (!env.pocketbase.superuserEmail || !env.pocketbase.superuserPassword) {
      throw new Error(
        'PocketBase superuser credentials are required. Set POCKETBASE_SUPERUSER_EMAIL and POCKETBASE_SUPERUSER_PASSWORD.',
      );
    }

    const authData = await this.client
      .collection('_superusers')
      .authWithPassword(env.pocketbase.superuserEmail, env.pocketbase.superuserPassword);

    return authData.record;
  }

  async getRemoteCollections() {
    await this.authenticateSuperuser();
    return this.client.collections.getFullList({
      sort: 'name',
      requestKey: null,
    });
  }

  async getRemoteCollectionMap() {
    const collections = await this.getRemoteCollections();

    return collections.reduce((map, collection) => {
      map.set(collection.name, collection);
      return map;
    }, new Map());
  }

  async verifyCollectionsExist() {
    try {
      const remoteCollectionMap = await this.getRemoteCollectionMap();
      const expectedNames = COLLECTION_SCHEMAS.map((schema) => schema.name);

      return {
        valid: expectedNames.every((name) => remoteCollectionMap.has(name)),
        expected: expectedNames,
        existing: expectedNames.filter((name) => remoteCollectionMap.has(name)),
        missing: expectedNames.filter((name) => !remoteCollectionMap.has(name)),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyExpectedCollections() {
    try {
      const remoteCollectionMap = await this.getRemoteCollectionMap();
      const collectionIdsByName = this.buildCollectionIdsByName(remoteCollectionMap);

      const collections = COLLECTION_SCHEMAS.map((expectedSchema) => {
        const remoteCollection = remoteCollectionMap.get(expectedSchema.name);

        if (!remoteCollection) {
          return {
            name: expectedSchema.name,
            exists: false,
            valid: false,
            issues: [`Collection "${expectedSchema.name}" does not exist.`],
          };
        }

        const issues = this.compareCollectionSchema(
          expectedSchema,
          remoteCollection,
          collectionIdsByName,
        );

        return {
          name: expectedSchema.name,
          exists: true,
          valid: issues.length === 0,
          issues,
        };
      });

      return {
        valid: collections.every((collection) => collection.valid),
        collections,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async syncExpectedCollections(options = {}) {
    const { deleteMissing = false } = options;

    try {
      const remoteCollectionMap = await this.getRemoteCollectionMap();
      const importPayload = this.buildImportPayload(remoteCollectionMap);

      await this.client.collections.import(importPayload, deleteMissing, {
        requestKey: null,
      });

      return {
        synced: true,
        deleteMissing,
        collections: importPayload.map((collection) => collection.name),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  buildCollectionIdsByName(remoteCollectionMap) {
    return COLLECTION_SCHEMAS.reduce((idsByName, schema) => {
      const remoteCollection = remoteCollectionMap.get(schema.name);
      idsByName[schema.name] = remoteCollection ? remoteCollection.id : schema.id;
      return idsByName;
    }, {});
  }

  buildImportPayload(remoteCollectionMap) {
    const collectionIdsByName = this.buildCollectionIdsByName(remoteCollectionMap);

    return COLLECTION_SCHEMAS.map((schema) => {
      const payload = toPocketBaseCollectionPayload(clone(schema));
      const remoteCollection = remoteCollectionMap.get(schema.name);

      if (remoteCollection) {
        payload.id = remoteCollection.id;
      }

      payload.fields = payload.fields.map((field) => {
        const originalField = schema.fields.find((schemaField) => schemaField.name === field.name);

        if (originalField && originalField.targetCollection) {
          return {
            ...field,
            collectionId: collectionIdsByName[originalField.targetCollection],
          };
        }

        return field;
      });

      return payload;
    });
  }

  compareCollectionSchema(expectedSchema, remoteCollection, collectionIdsByName) {
    const issues = [];

    if (remoteCollection.type !== expectedSchema.type) {
      issues.push(
        `Expected type "${expectedSchema.type}" but found "${remoteCollection.type}".`,
      );
    }

    SCHEMA_RULE_KEYS.forEach((ruleKey) => {
      if (expectedSchema[ruleKey] !== undefined && remoteCollection[ruleKey] !== expectedSchema[ruleKey]) {
        issues.push(`Rule mismatch for ${ruleKey}.`);
      }
    });

    expectedSchema.fields.forEach((expectedField) => {
      const remoteField = remoteCollection.fields.find((field) => field.name === expectedField.name);

      if (!remoteField) {
        issues.push(`Missing field "${expectedField.name}".`);
        return;
      }

      issues.push(
        ...this.compareFieldSchema(expectedField, remoteField, collectionIdsByName),
      );
    });

    issues.push(...this.compareIndexes(expectedSchema.indexes || [], remoteCollection.indexes || []));

    return issues;
  }

  compareFieldSchema(expectedField, remoteField, collectionIdsByName) {
    const issues = [];

    if (remoteField.type !== expectedField.type) {
      issues.push(
        `Field "${expectedField.name}" expected type "${expectedField.type}" but found "${remoteField.type}".`,
      );
    }

    if (Boolean(remoteField.required) !== Boolean(expectedField.required)) {
      issues.push(`Field "${expectedField.name}" required flag mismatch.`);
    }

    ['min', 'max', 'maxSelect', 'maxSize', 'cascadeDelete'].forEach((key) => {
      if (expectedField[key] !== undefined && remoteField[key] !== expectedField[key]) {
        issues.push(`Field "${expectedField.name}" ${key} mismatch.`);
      }
    });

    if (expectedField.targetCollection) {
      const expectedCollectionId = collectionIdsByName[expectedField.targetCollection];

      if (remoteField.collectionId !== expectedCollectionId) {
        issues.push(`Field "${expectedField.name}" relation target mismatch.`);
      }
    }

    if (expectedField.values) {
      const expectedValues = sortValues(expectedField.values);
      const remoteValues = sortValues(remoteField.values || []);

      if (JSON.stringify(expectedValues) !== JSON.stringify(remoteValues)) {
        issues.push(`Field "${expectedField.name}" select values mismatch.`);
      }
    }

    if (expectedField.mimeTypes) {
      const expectedMimeTypes = sortValues(expectedField.mimeTypes);
      const remoteMimeTypes = sortValues(remoteField.mimeTypes || []);

      if (JSON.stringify(expectedMimeTypes) !== JSON.stringify(remoteMimeTypes)) {
        issues.push(`Field "${expectedField.name}" mime types mismatch.`);
      }
    }

    return issues;
  }

  compareIndexes(expectedIndexes, remoteIndexes) {
    const remoteIndexNames = remoteIndexes.map(getIndexName);

    return expectedIndexes
      .filter((index) => !remoteIndexNames.includes(getIndexName(index)))
      .map((index) => `Missing index "${getIndexName(index)}".`);
  }

  handleError(error) {
    const normalizedError = normalizePocketBaseError(error);
    const serviceError = new Error(normalizedError.message);

    serviceError.statusCode = normalizedError.status;
    serviceError.details = normalizedError.details;
    serviceError.isAbort = normalizedError.isAbort;

    return serviceError;
  }
}

module.exports = new PocketBaseSchemaService();
