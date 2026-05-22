import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getId } from '../utils/format.js';

const CART_KEY = 'del_app_cart';
const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || { restaurant: null, items: [] };
  } catch {
    return { restaurant: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const value = useMemo(
    () => ({
      restaurant: cart.restaurant,
      items: cart.items,
      count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),

      addItem(item, restaurant) {
        const incomingRestaurantId = getId(restaurant);

        setCart((current) => {
          const currentRestaurantId = getId(current.restaurant);
          const shouldReset =
            current.restaurant && incomingRestaurantId && currentRestaurantId !== incomingRestaurantId;
          const items = shouldReset ? [] : current.items;
          const existing = items.find((entry) => getId(entry) === getId(item));

          toast.success(existing ? 'Quantity updated' : 'Added to cart');

          return {
            restaurant,
            items: existing
              ? items.map((entry) =>
                  getId(entry) === getId(item) ? { ...entry, quantity: entry.quantity + 1 } : entry
                )
              : [...items, { ...item, quantity: 1 }]
          };
        });
      },

      updateQuantity(id, quantity) {
        setCart((current) => ({
          ...current,
          items: current.items
            .map((item) => (getId(item) === id ? { ...item, quantity: Math.max(1, quantity) } : item))
            .filter((item) => item.quantity > 0)
        }));
      },

      removeItem(id) {
        setCart((current) => ({
          ...current,
          items: current.items.filter((item) => getId(item) !== id)
        }));
      },

      clearCart() {
        setCart({ restaurant: null, items: [] });
      }
    }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
