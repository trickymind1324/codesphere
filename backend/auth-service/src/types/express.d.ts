// Augment Passport's empty Express.User so req.user carries our JWT payload fields.
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      role?: string;
      tier?: string;
    }
  }
}

export {};
