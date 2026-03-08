import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TrendingItem {
    id: bigint;
    title: string;
    views: bigint;
    trendingScore: bigint;
    description: string;
    likes: bigint;
    timestamp: bigint;
    category: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrendingItem(title: string, description: string, category: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteTrendingItem(itemId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getItemsByCategory(category: string): Promise<Array<TrendingItem>>;
    getTrendingItem(itemId: bigint): Promise<TrendingItem>;
    getTrendingItems(): Promise<Array<TrendingItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    incrementViews(itemId: bigint): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    likeItem(itemId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
