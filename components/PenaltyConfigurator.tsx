import { useState } from "react";
import { PenaltyConfigurator } from "@/components/PenaltyConfigurator"; // <- Aquí lo importas
import { PENALTIES } from "@/lib/penalties";

export default function RuletaPage() {
  const [selectedPenalty, setSelectedPenalty] = useState<any>(null);

  // Supongamos que aquí es cuando cae la ruleta en un número
  const handleSpinResult = (penaltyId: number) => {
    const penalty = PENALTIES.find(p => p.id === penaltyId);
    setSelectedPenalty(penalty);
  };

  // Lo que pasa cuando le dan al botón de aplicar el castigo con su input
  const handleAssign = async (penaltyId: number, extraConfig: string) => {
    console.log("Asignando penitencia:", penaltyId, "con config:", extraConfig);
    // Aquí mandas los datos a tu API para guardarlos en Redis
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-white">Ruleta de Castigos</h1>
      
      {/* Botón de prueba para simular que salió la penitencia 1 o 2 */}
      <button onClick={() => handleSpinResult(1)} className="bg-blue-600 p-2 text-white rounded mr-2">
        Simular salida Penitencia 1
      </button>
      <button onClick={() => handleSpinResult(2)} className="bg-blue-600 p-2 text-white rounded">
        Simular salida Penitencia 2 (Spells)
      </button>

      {/* AQUÍ ES DONDE SE MUESTRA EL COMPONENTE DE LA CAJITA */}
      <PenaltyConfigurator 
        selectedPenalty={selectedPenalty} 
        onAssign={handleAssign} 
      />
    </main>
  );
}