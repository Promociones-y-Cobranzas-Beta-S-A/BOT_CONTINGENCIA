import pandas as pd

archivo_csv = 'Codigo py\MUESTRA_EVOLUCION.csv'

columnas_filtradas = [
    "NRO_PRODUCTO",
    "NOMBRE_TITULAR",
    "NRO_IDENTIFICACION",
    "NOMBRE_RECUPERADOR_JURIDICO",
    "CANT_DIAS_MORA_ACTUAL",
    "MONTO_PAGO_FACTURACION",
    "MONTO_PAGO_MINIMO_ACTUAL",
    "MONTO_MORA_PESOS",
    "MONTO_TOTAL_CLIENTE",
    "FECHA_PAGO_ACTUAL",
]

df = pd.read_csv(archivo_csv, sep=',', encoding='utf-8', dtype={"NRO_PRODUCTO": str})

# Enmascarar NRO_PRODUCTO: mostrar solo los 4 primeros y 4 últimos dígitos, conservando ceros iniciales
def enmascarar_nro_producto(nro):
    if pd.isnull(nro):
        return ""
    nro = str(nro)
    if len(nro) > 8:
        return f"{nro[:4]}{'*'*(len(nro)-8)}{nro[-4:]}"
    else:
        return nro  # Si tiene 8 o menos, no enmascara

df_filtrado = df[columnas_filtradas].copy()
df_filtrado["NRO_PRODUCTO"] = df_filtrado["NRO_PRODUCTO"].apply(enmascarar_nro_producto)

# Ordenar por NRO_IDENTIFICACION de menor a mayor
df_filtrado = df_filtrado.sort_values(by="NRO_IDENTIFICACION", ascending=True)

df_filtrado.to_excel('Muestra para Bot Contingencia.xlsx', index=False)

print("✅ Archivo filtrado generado: Muestra para Bot Contingencia.xlsx")
    # Subir archivo a la unidad compartida
    