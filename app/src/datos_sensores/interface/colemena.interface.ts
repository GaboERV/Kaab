export interface ColmenasParametros {

  colmena_id?: string;
  temperatura: number;
  humedad: number;
  presion: number;
  peso: number;
  timestamp: number; // Or Date, depending on how you want to represent the time
}