
export interface Product {
  id: number;
  title: string;
  price: number;
  desc: string;
  category: string;
  image: string;
  sizes: string[];
  featured: boolean;
  aspect?: string;
}

export interface CartItem {
  cartId: string;
  id: number;
  variationId?: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
}

export type View = 'home' | 'collection' | 'process' | 'about' | 'lab' | 'checkout' | 'thankyou';

export interface FormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  houseNumber: string;
  postcode: string;
  city: string;
}
