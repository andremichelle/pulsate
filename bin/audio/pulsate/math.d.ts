export declare class Circle {
    x: number;
    y: number;
    radius: number;
    radiusVelocity: number;
    constructor(x: number, y: number, radius: number, radiusVelocity?: number);
}
export interface Collision {
    time: number;
    resolve(): void;
    clear(): void;
}
export declare class PulsateSolver {
    readonly circles: Circle[];
    readonly collisionSelf: CollisionSelf;
    readonly collisionPair: CollisionPair;
    constructor();
    clear(): void;
    run(time: number, observer: (collision: Collision) => void): void;
    detect(dt: number): Collision;
    integrate(dt: number): void;
}
export declare class CollisionPair implements Collision {
    time: number;
    circleA: Circle;
    circleB: Circle;
    type: number;
    detect(a: Circle, b: Circle, max: number): boolean;
    resolve(): void;
    clear(): void;
}
export declare class CollisionSelf implements Collision {
    time: number;
    circle: Circle;
    detect(circle: Circle, max: number): boolean;
    resolve(): void;
    clear(): void;
}
