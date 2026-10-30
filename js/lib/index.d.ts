export type Status = 'pass' | 'warn' | 'fail';
export interface Result { area: string; status: Status; message: string; }
export interface Report { url?: string; score: number; results: Result[]; }
export function checkUrl(url: string, opts?: { robots?: boolean; timeoutMs?: number }): Promise<Report & { url: string }>;
export function checkHtml(html: string, robotsTxt?: string): Report;
export function check(html: string, robotsTxt?: string | null): Result[];
export function score(results: Result[]): number;
export type RobotsGroups = Record<string, Array<['allow' | 'disallow', string]>>;
export function parseRobots(text: string): RobotsGroups;
export function blocksRoot(groups: RobotsGroups, agent: string): boolean;
export const AI_CRAWLERS: string[];
