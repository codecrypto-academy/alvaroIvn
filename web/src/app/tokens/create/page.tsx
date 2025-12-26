"use client";

/**
 * Create Token Page
 * Formulario para crear nuevos tokens
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { createToken, getUserTokens, getTokenBalance, getToken } from "@/lib/web3";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Token } from "@/types";

export default function CreateTokenPage() {
  const router = useRouter();
  const { signer, isConnected, isAdmin, userRole, account } = useWallet();

  // Determinar tipo de usuario en la cadena de suministro
  const isProducer = userRole === "PRODUCER";
  const isFactoryOrRetailer = userRole === "FACTORY" || userRole === "RETAILER";

  const [formData, setFormData] = useState({
    name: "",
    totalSupply: "",
    features: "",
    parentId: isFactoryOrRetailer ? "" : "0", // Factory/Retailer deben especificar parentId
    amountConsumed: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Array<Token & { balance: number }>>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Verificar si el usuario puede crear tokens
  const canCreateTokens = !isAdmin && userRole !== "CONSUMER";

  // Cargar tokens disponibles del usuario (con balance > 0)
  useEffect(() => {
    const loadAvailableTokens = async () => {
      if (!account || !isFactoryOrRetailer) return;

      setLoadingTokens(true);
      try {
        // Obtener IDs de tokens del usuario
        const tokenIds = await getUserTokens(account);

        // Obtener información completa de cada token con balance
        const tokensWithBalance = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const token = await getToken(tokenId);
            const balance = await getTokenBalance(tokenId, account);
            return { ...token, balance };
          })
        );

        // Filtrar solo tokens con balance > 0
        const filtered = tokensWithBalance.filter((t) => t.balance > 0);
        setAvailableTokens(filtered);
      } catch (err) {
        console.error("Error al cargar tokens disponibles:", err);
      } finally {
        setLoadingTokens(false);
      }
    };

    loadAvailableTokens();
  }, [account, isFactoryOrRetailer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer) {
      setError("No se pudo obtener el signer");
      return;
    }

    // Validaciones
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    const supply = parseInt(formData.totalSupply);
    if (isNaN(supply) || supply <= 0) {
      setError("El supply debe ser un número mayor a 0");
      return;
    }

    // Validar JSON de features si no está vacío
    if (formData.features.trim()) {
      try {
        JSON.parse(formData.features);
      } catch {
        setError("Las características deben ser un JSON válido");
        return;
      }
    }

    // Validar parentId según el rol
    const parentId = isProducer ? 0 : (parseInt(formData.parentId) || 0);

    if (parentId < 0) {
      setError("El Parent ID debe ser 0 o un número positivo");
      return;
    }

    // FACTORY y RETAILER DEBEN crear tokens derivados
    if (isFactoryOrRetailer && parentId === 0) {
      setError("Como Factory/Retailer debes crear tokens derivados. Ingresa el ID del token padre.");
      return;
    }

    // Validar cantidad a consumir
    const amountConsumed = parseInt(formData.amountConsumed) || 0;
    if (parentId > 0 && amountConsumed <= 0) {
      setError("Debes especificar cuántos tokens del padre vas a consumir");
      return;
    }
    if (parentId === 0 && amountConsumed > 0) {
      setError("No puedes consumir tokens cuando creas un token original");
      return;
    }

    // Verificar que no consuma más tokens de los disponibles
    if (isFactoryOrRetailer && parentId > 0) {
      const selectedToken = availableTokens.find(t => t.id === parentId);
      if (selectedToken && amountConsumed > selectedToken.balance) {
        setError(`No puedes consumir ${amountConsumed.toLocaleString()} tokens. Solo tienes ${selectedToken.balance.toLocaleString()} disponibles.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await createToken(
        signer,
        formData.name,
        supply,
        formData.features || "{}",
        parentId,
        amountConsumed
      );

      // Redirigir a la lista de tokens
      router.push("/tokens");
    } catch (err: any) {
      setError(err.message || "Error al crear token");
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="warning">Debes conectar tu wallet para crear tokens</Alert>
        </main>
      </div>
    );
  }

  // Bloquear acceso para administradores y consumidores
  if (!canCreateTokens) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="error">
            {isAdmin
              ? "Los administradores no pueden crear tokens. Solo pueden visualizar y gestionar usuarios."
              : "Los consumidores no pueden crear tokens. Solo pueden recibir y visualizar tokens."}
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/tokens")} variant="secondary">
              Volver a Mis Tokens
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Token</h1>
          <p className="mt-2 text-gray-600">
            Crea un token para representar un producto o materia prima
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Token</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <Input
                label="Nombre del Token"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Café Orgánico Colombia"
                required
              />

              {/* Total Supply */}
              <Input
                label="Cantidad Total (Supply)"
                name="totalSupply"
                type="number"
                value={formData.totalSupply}
                onChange={handleChange}
                placeholder="Ej: 1000"
                required
                min="1"
              />

              {/* Features JSON */}
              <Textarea
                label="Características (JSON)"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder='{"origen": "Colombia", "tipo": "Arábica", "certificación": "Orgánico"}'
                rows={5}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Las características deben estar en formato JSON válido.
                  Ejemplo: {`{"key": "value", "key2": "value2"}`}
                </p>
              </div>

              {/* Parent Token ID - Select para Factory/Retailer, Input para otros */}
              {isFactoryOrRetailer ? (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Padre a Consumir (requerido)
                  </label>
                  {loadingTokens ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      Cargando tokens disponibles...
                    </div>
                  ) : availableTokens.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                      No tienes tokens disponibles para consumir. Primero debes recibir tokens de otro usuario.
                    </div>
                  ) : (
                    <select
                      name="parentId"
                      value={formData.parentId}
                      onChange={handleSelectChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Selecciona un token padre...</option>
                      {availableTokens.map((token) => (
                        <option key={token.id} value={token.id}>
                          #{token.id} - {token.name} (Balance: {token.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <Input
                  label="Parent Token ID (opcional)"
                  name="parentId"
                  type="number"
                  value={formData.parentId}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  disabled={isProducer}
                />
              )}

              <div className={`border rounded-md p-3 ${
                isProducer ? 'bg-yellow-50 border-yellow-200' :
                isFactoryOrRetailer ? 'bg-orange-50 border-orange-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-sm text-gray-700">
                  {isProducer ? (
                    <>
                      <strong>Nota para Productores:</strong> Como eres el primer eslabón de la cadena,
                      tus tokens siempre son originales (Parent ID = 0). No puedes derivar de otros tokens.
                    </>
                  ) : isFactoryOrRetailer ? (
                    <>
                      <strong>Restricción de Cadena de Suministro:</strong> Como Factory/Retailer, DEBES crear tokens
                      derivados de materias primas existentes. Selecciona el token padre que vas a transformar.
                      Esto garantiza la trazabilidad completa de la cadena de suministro.
                    </>
                  ) : (
                    <>
                      <strong>Parent Token ID:</strong> Si este token deriva de otro token existente,
                      ingresa su ID. De lo contrario, deja 0 para indicar que es un token original.
                    </>
                  )}
                </p>
              </div>

              {/* Cantidad a Consumir (solo visible si parentId > 0) */}
              {!isProducer && parseInt(formData.parentId) > 0 && (() => {
                const selectedToken = availableTokens.find(t => t.id === parseInt(formData.parentId));
                const maxBalance = selectedToken?.balance || 0;

                return (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad a Consumir del Token Padre
                      </label>
                      <Input
                        name="amountConsumed"
                        type="number"
                        value={formData.amountConsumed}
                        onChange={handleChange}
                        placeholder="Ej: 1000"
                        min="1"
                        max={maxBalance}
                        required
                      />
                      {maxBalance > 0 && (
                        <p className="mt-1 text-sm text-gray-600">
                          Balance disponible: <strong>{maxBalance.toLocaleString()}</strong>
                        </p>
                      )}
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                      <p className="text-sm text-orange-800">
                        <strong>Consumo de materia prima:</strong> Al crear un token derivado, debes especificar
                        cuántos tokens del padre vas a consumir. Por ejemplo, si tienes 1200kg de café en grano
                        y produces 800kg de café tostado, deberías consumir 1000kg del token padre.
                      </p>
                    </div>
                  </>
                );
              })()}

              {error && <Alert variant="error">{error}</Alert>}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  disabled={isFactoryOrRetailer && availableTokens.length === 0}
                >
                  Crear Token
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/tokens")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>

              {isFactoryOrRetailer && availableTokens.length === 0 && !loadingTokens && (
                <Alert variant="warning">
                  No puedes crear tokens derivados sin tener materia prima. Espera a que otro usuario te transfiera tokens.
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-3">¿Qué es un Token?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Un token representa un producto o materia prima en la cadena de suministro. Cada
                token tiene:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Un nombre único que lo identifica</li>
                <li>Una cantidad total (supply) que se crea inicialmente</li>
                <li>Características personalizadas en formato JSON</li>
                <li>Opcionalmente, puede derivar de otro token (trazabilidad)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}