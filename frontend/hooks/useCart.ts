import { useReducer } from 'react';
import { SaleItem, Product } from '../../shared/types';

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product, quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: SaleItem[], action: CartAction): SaleItem[] => {
  switch (action.type) {
    case 'ADD_ITEM':
      const { product, quantity } = action.payload;
      const existingItem = state.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        return state.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
            : item
        );
      }
      return [
        ...state,
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          imageUrl: product.imageUrl,
          returnableQuantity: 0, // This is temporary, will be set on sale completion
        },
      ];
    case 'REMOVE_ITEM':
      return state.filter(item => item.productId !== action.payload.productId);
    case 'UPDATE_QUANTITY':
        if (action.payload.quantity <= 0) {
            return state.filter(item => item.productId !== action.payload.productId);
        }
        return state.map(item =>
            item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity, totalPrice: action.payload.quantity * item.unitPrice }
            : item
        );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

export const useCart = () => {
  const [cart, dispatch] = useReducer(cartReducer, []);
  return { cart, dispatch };
};