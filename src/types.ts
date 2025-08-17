export type ImageRef = {
    repository: string;
    reference?: string;
  };
  
  export type DockerHubImage = {
    name: string;
    namespace: string;
    repository_type: string;
    status: string;
    description?: string;
    star_count?: number;
    pull_count?: number;
    last_updated?: string;
  };
  
  export type Manifest = {
    schemaVersion: number;
    mediaType?: string;
    config?: { mediaType: string; digest: string; size: number };
    layers?: Array<{ mediaType: string; digest: string; size: number }>; // simplified
  };