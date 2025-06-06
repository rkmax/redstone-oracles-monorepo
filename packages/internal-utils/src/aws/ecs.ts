import {
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListClustersCommand,
  ListServicesCommand,
} from "@aws-sdk/client-ecs";
import { getEcsClient } from "./aws-clients";

export class AwsEcs {
  constructor(private readonly client: ECSClient) {}

  static forRegion(region: string) {
    return new AwsEcs(getEcsClient(region));
  }

  async listClusters(): Promise<string[]> {
    let clusterArns: string[] | undefined;
    let nextToken: string | undefined = undefined;
    const result = [];
    do {
      const command: ListClustersCommand = new ListClustersCommand({
        nextToken,
      });
      ({ clusterArns, nextToken } = await this.client.send(command));
      result.push(...(clusterArns ?? []));
    } while (nextToken);
    return result;
  }

  async listServices(clusterArn: string): Promise<string[]> {
    const command = new ListServicesCommand({ cluster: clusterArn });
    const { serviceArns } = await this.client.send(command);

    return serviceArns ?? [];
  }

  async describeService(clusterArn: string, serviceArn: string) {
    const command = new DescribeServicesCommand({
      cluster: clusterArn,
      services: [serviceArn],
    });
    const { services } = await this.client.send(command);

    return services?.[0];
  }

  async describeTaskDefinition(taskDefinitionArn: string) {
    const command = new DescribeTaskDefinitionCommand({
      taskDefinition: taskDefinitionArn,
    });
    const { taskDefinition } = await this.client.send(command);

    return taskDefinition;
  }
}
