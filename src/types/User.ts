/**
 * User Type Definition
 * Matches the Django API User model
 */
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

/**
 * User Create/Update Input
 * For creating or updating users (id is optional)
 */
export interface UserInput {
  name: string;
  email: string;
  is_active?: boolean;
}

/**
 * API Response for paginated list
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * API Response for activate/deactivate actions
 */
export interface ActionResponse {
  status: string;
  user: User;
}

