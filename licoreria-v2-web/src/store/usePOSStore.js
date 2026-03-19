import { create } from 'zustand';

export const usePOSStore = create((set, get) => ({
  cart: [],
  
  addToCart: (product) => {
    const { cart } = get();
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1, discount: 0 }] });
    }
  },
  
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.id !== productId) });
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  updateDiscount: (productId, discount) => {
    set({
      cart: get().cart.map((item) =>
        item.id === productId ? { ...item, discount: parseFloat(discount) || 0 } : item
      ),
    });
  },
  
  clearCart: () => set({ cart: [] }),
  
  getTotal: () => {
    return get().cart.reduce((total, item) => {
        const price = parseFloat(item.precio_venta || item.precio) || 0;
        const discount = parseFloat(item.discount) || 0;
        return total + (price * item.quantity) - discount;
    }, 0);
  },
}));
