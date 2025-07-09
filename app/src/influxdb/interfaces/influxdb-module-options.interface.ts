// src/influxdb/interfaces/influxdb-module-options.interface.ts
export interface InfluxDBModuleOptions {
  url: string;
  token: string;
  org: string;
  bucket: string;
  isGlobal?: boolean; // Optional: Make the module global
}