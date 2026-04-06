import { create } from 'zustand';

export const usePOSStore = create((set, get) => ({
  cart: [],
  
  addToCart: (product, presentacion = null) => {
    const { cart } = get();
    const cartId = `${product.id}_${presentacion ? presentacion.id : 'base'}`;
    const existingItem = cart.find((item) => item.cartId === cartId);
    
    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      const nombre_mostrar = presentacion ? `${product.nombre} (${presentacion.nombre})` : product.nombre;
      const precio_venta = presentacion ? parseFloat(presentacion.precio_venta) : (parseFloat(product.precio_venta) || parseFloat(product.precio) || 0);
      const cantidad_fisica_por_unidad = presentacion ? parseInt(presentacion.cantidad_unidades) : 1;

      set({ cart: [...cart, { 
         ...product, 
         cartId, 
         presentacion_id: presentacion?.id || null, 
         nombre_mostrar, 
         precio_venta, 
         cantidad_fisica_por_unidad, 
         quantity: 1, 
         discount: 0 
      }] });
    }
  },
  
  removeFromCart: (cartId) => {
    set({ cart: get().cart.filter((item) => item.cartId !== cartId) });
  },
  
  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      ),
    });
  },

  updateDiscount: (cartId, discount) => {
    set({
      cart: get().cart.map((item) =>
        item.cartId === cartId ? { ...item, discount: parseFloat(discount) || 0 } : item
      ),
    });
  },
  
  clearCart: () => set({ cart: [] }),
  
  getTotal: () => {
    return get().cart.reduce((total, item) => {
        const price = parseFloat(item.precio_venta) || 0;
        const discount = parseFloat(item.discount) || 0;
        return total + (price * item.quantity) - discount;
    }, 0);
  },
}));
