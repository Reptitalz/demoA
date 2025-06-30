
declare global {
  interface Window {
    Conekta: {
      setPublicKey: (key: string) => void;
      Checkout: new (options: {
        target: string | HTMLElement;
        checkout_order_id: string;
        onFinalize: (details: any) => void;
        onError: (error: any) => void;
        [key: string]: any;
      }) => {
        render: () => void;
      };
    };
  }
}

// This export statement is needed to make the file a module
export {};
