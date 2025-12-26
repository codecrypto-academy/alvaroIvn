import re

# Leer archivo
with open('test/SupplyChain.t.sol', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón para encontrar createToken con 4 parámetros terminando en 0)
# y reemplazarlo con 5 parámetros terminando en 0, 0)
pattern1 = r'createToken\(([^,]+),\s*(\d+),\s*([^,]+),\s*0\);'
replacement1 = r'createToken(\1, \2, \3, 0, 0);'

# Patrón para encontrar createToken con 4 parámetros terminando en 1)
# y reemplazarlo con 5 parámetros terminando en 1, 0)
pattern2 = r'createToken\(([^,]+),\s*(\d+),\s*([^,]+),\s*1\);'
replacement2 = r'createToken(\1, \2, \3, 1, 0);'

# Patrón para encontrar createToken con 4 parámetros terminando en 999)
# y reemplazarlo con 5 parámetros terminando en 999, 50)
pattern3 = r'createToken\(([^,]+),\s*(\d+),\s*([^,]+),\s*999\);'
replacement3 = r'createToken(\1, \2, \3, 999, 50);'

# Aplicar reemplazos
content = re.sub(pattern1, replacement1, content)
content = re.sub(pattern2, replacement2, content)
content = re.sub(pattern3, replacement3, content)

# Guardar archivo
with open('test/SupplyChain.t.sol', 'w', encoding='utf-8') as f:
    f.write(content)

print("Archivo actualizado correctamente")
