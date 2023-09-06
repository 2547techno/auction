export class Bucket {
    resetInterval: number;
    maxPoints: number;
    points: number;
    interval: NodeJS.Timeout;

    constructor(resetIntervalMs: number, maxPoints: number) {
        this.resetInterval = resetIntervalMs;
        this.maxPoints = maxPoints;
        this.points = maxPoints;
        this.interval = setInterval(() => {
            this.points = this.maxPoints;
        }, this.resetInterval);
    }

    consume(amount: number = 1) {
        this.points -= amount;
    }

    getPoints() {
        return this.points;
    }
}