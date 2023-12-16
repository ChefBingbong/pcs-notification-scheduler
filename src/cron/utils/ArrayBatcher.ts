type Instance<T> = {
      groupSize: number;
      groupIndex: number;
      originalGroup: T[];
      currentGroup: T[];
};

export type LoadBalancerInstance<T> = Map<string, Instance<T>>;

export class ArrayBatcher {
      private static instances: LoadBalancerInstance<any>;

      constructor() {
            ArrayBatcher.instances = new Map<string, Instance<any>>();
      }

      public getCurrentBatch<T>(key: string): T[] {
            const currentGroup = ArrayBatcher.instances.get(key).currentGroup;
            return currentGroup;
      }

      public initialize<T>(key: string, originalGroup: T[], groupSize?: number | undefined): void {
            const subscriberLen = originalGroup.length;

            if (subscriberLen === 0) {
                  throw new Error(
                        `Error check your array has one element and is bigger than group size`,
                  );
            }
            ArrayBatcher.instances.set(key, {
                  groupSize: groupSize ?? subscriberLen,
                  groupIndex: 0,
                  originalGroup,
                  currentGroup: this.getCurrentGroup(0, groupSize, originalGroup),
            });
      }

      public getNextGroup<T>(key: string): T[] {
            const instance = ArrayBatcher.instances.get(key);
            if (!instance) throw new Error(`Instance '${key}' not found`);

            this.incrementGroupIndex(instance);
            const subscribers = this.getCurrentGroup(
                  instance.groupIndex,
                  instance.groupSize,
                  instance.originalGroup,
            );
            instance.currentGroup = subscribers;

            return subscribers;
      }

      public updateGroupSize(size: number, key: string): void {
            const instance = ArrayBatcher.instances.get(key);
            if (size < 0) {
                  throw new Error(`group size cannot be smaller than 1`);
            }
            instance.groupSize = size;
      }

      public updateOriginalGroup<T>(key: string, subscribers: T[]): void {
            const instance = ArrayBatcher.instances.get(key);
            try {
                  if (subscribers.length === 0) {
                        throw new Error(
                              `Error: Check your array; it has one element and is bigger than the group size`,
                        );
                  }
                  if (instance.groupSize === instance.originalGroup.length) {
                        this.updateGroupSize(subscribers.length, key);
                  }
                  instance.originalGroup = subscribers;
            } catch (error) {
                  console.error(
                        `${
                              (error as Error).message
                        }: Error occured in setUpdateActiveSubscribers. will revert this call and continue as normal`,
                  );
                  const originalActiveSubscribers = instance.originalGroup;
                  instance.originalGroup = originalActiveSubscribers;

                  this.getNextGroup(key);
            }
      }

      public static getAllBatcherInstances<T>(): LoadBalancerInstance<T> {
            const allInstances = {} as LoadBalancerInstance<T>;
            ArrayBatcher.instances.forEach((instance: Instance<T>, key: string) => {
                  allInstances[key] = instance;
            });
            return allInstances;
      }

      public static getBatcherInstance<T>(key: string): Instance<T> {
            const instance = ArrayBatcher.instances.get(key);
            return instance;
      }

      public static getGroupSize(key: string): number {
            const instance = ArrayBatcher.instances.get(key);
            return instance.groupSize;
      }

      private getCurrentGroup<T>(groupIndex: number, groupSize: number, originalGroup: T[]): T[] {
            const startIndex = groupIndex * groupSize;
            const subscribers = originalGroup.slice(startIndex, startIndex + groupSize);

            return subscribers;
      }

      private incrementGroupIndex<T>(instance: Instance<T>): void {
            const len = instance.originalGroup.length;
            instance.groupIndex = (instance.groupIndex + 1) % Math.ceil(len / instance.groupSize);
      }
}
export const arrayBatcher = new ArrayBatcher();
