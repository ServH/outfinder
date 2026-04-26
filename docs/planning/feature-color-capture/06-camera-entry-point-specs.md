# Camera Entry Point — Especificaciones de implementación

> Diseño validado: **Camino A · NavBar v3**  
> Referencia visual: `designs/camera.pen` → frame "NavBar v3" (canvas x:0, y:1940)

---

## Resumen del cambio

Reemplazar el FAB circular discreto (actual) por un botón de cámara prominente **centrado en el tab bar**, eliminando Settings del nav y moviéndolo al header.

| Antes | Después |
|---|---|
| 3 tabs: Colors · Favorites · Settings | 2 tabs: Colors · Favorites + FAB cámara central |
| FAB pequeño (48pt) esquina inferior derecha | FAB grande (64pt) centrado, flotando sobre el tab bar |
| Settings como pestaña | Settings → icono engranaje en el header |

---

## 1 · CustomTabBar component

Crear `src/navigation/CustomTabBar.tsx`. React Navigation lo recibe vía `tabBar` prop en el Navigator.

### Estructura de layout

```
<View> ← wrap, height:100, overflow:visible, position:absolute, bottom:0
  <View> ← bar bg, y:38, height:62, borderTopWidth:1
  <Pressable> ← Colors tab, x:20, y:50
  <Pressable> ← Favs tab, x:290, y:50
  <Pressable> ← Camera FAB, x:163, y:6   ← encima de todo (zIndex alto)
```

### Wrap (contenedor raíz)

| Propiedad | Valor |
|---|---|
| `width` | `'100%'` |
| `height` | `100` |
| `position` | `'absolute'` |
| `bottom` | `0` |
| `overflow` | `'visible'` |
| `backgroundColor` | `'transparent'` |
| Shadow iOS | `shadowColor:'#000'` `shadowOffset:{y:-3}` `shadowRadius:10` `shadowOpacity:0.08` |

### Bar background (View interior)

| Propiedad | Valor |
|---|---|
| `position` | `'absolute'` |
| `left` / `right` | `0` |
| `bottom` | `0` |
| `height` | `62` |
| `backgroundColor` | `wadaTokens.warmBg` → `#f5efe6` |
| `borderTopWidth` | `1` |
| `borderTopColor` | `#e0d9d0` |

### Camera FAB (Pressable)

| Propiedad | Valor |
|---|---|
| `position` | `'absolute'` |
| `width` | `64` |
| `height` | `64` |
| `left` | `163` (= (390 - 64) / 2) |
| `top` | `6` |
| `borderRadius` | `32` |
| `backgroundColor` | `wadaTokens.wadaDark` → `#1c1c1e` |
| Shadow iOS | `shadowColor:'#1c1c1e'` `shadowOffset:{y:5}` `shadowRadius:12` `shadowOpacity:0.20` |
| `alignItems` | `'center'` |
| `justifyContent` | `'center'` |
| `zIndex` | `10` |

**Icono:** SF Symbol `camera.fill`, 28×28pt, color `#ffffff`  
**Estado pressed:** `opacity: 0.85` + `transform: scale(0.96)` (spring animation)

### Tabs (Colors y Favorites)

| Propiedad | Colors | Favs |
|---|---|---|
| `position` | `'absolute'` | `'absolute'` |
| `left` | `20` | `290` |
| `top` | `50` | `50` |
| `width` | `80` | `80` |
| `height` | `42` | `42` |
| Icon SF Symbol | `paintpalette` | `heart` |
| Icon size | `22×22` | `22×22` |
| Label (EN / ES) | `"COLORS"` / `"COLORES"` | `"FAVS"` / `"FAVS"` |
| Label size | `10pt Inter_600SemiBold` | `10pt Inter_600SemiBold` |
| Letter spacing | `0.5` | `0.5` |
| Color activo | `wadaTokens.wadaDark` `#1c1c1e` | — |
| Color inactivo | — | `wadaTokens.wadaMuted` `#9e8e7e` |

> El tab activo usa el color oscuro, el inactivo usa muted. Sin fondo ni pill — solo cambio de color.

---

## 2 · Settings gear en el header

Añadir un botón de engranaje en el header de **ColorHome** y **FavoritesScreen**.

```tsx
// Dentro del header, a la derecha del título
<Pressable
  onPress={() => navigation.navigate('SettingsTab')}
  accessibilityRole="button"
  accessibilityLabel={t('tabs.settings')}
  hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
  style={{ padding: 11 }}
>
  <SymbolView name="gearshape" tintColor={wadaTokens.wadaMuted} size={22} />
</Pressable>
```

| Propiedad | Valor |
|---|---|
| SF Symbol | `gearshape` |
| Tamaño | `22×22 pt` |
| Color | `wadaTokens.wadaMuted` → `#9e8e7e` |
| Hit area | `44×44 pt` (via `hitSlop`) |
| Posición | Header top-right, mismo nivel que el título |

---

## 3 · Cambios en TabNavigator.tsx

```tsx
// ANTES
<Tab.Navigator screenOptions={{ ... }}>
  <Tab.Screen name="ColorsTab" ... />
  <Tab.Screen name="FavoritesTab" ... />
  <Tab.Screen name="SettingsTab" ... />   // ← ELIMINAR de aquí
</Tab.Navigator>

// DESPUÉS
<Tab.Navigator
  tabBar={(props) => <CustomTabBar {...props} />}  // ← AÑADIR
  screenOptions={{ headerShown: false, ... }}
>
  <Tab.Screen name="ColorsTab" ... />
  <Tab.Screen name="FavoritesTab" ... />
  <Tab.Screen name="SettingsTab" ... />   // ← mantener en navigator para navegar a él
</Tab.Navigator>
```

> `SettingsTab` se mantiene en el navigator para poder navegar a él vía `navigation.navigate('SettingsTab')` desde el gear del header. Simplemente **no se renderiza** en el `CustomTabBar` (solo Colors y Favs + FAB cámara).

---

## 4 · Eliminar FAB actual en ColorHome.tsx

Eliminar el bloque completo (líneas 626–652 aprox.):

```tsx
// ELIMINAR todo este bloque:
<Pressable
  onPress={handleCameraPress}
  accessibilityRole="button"
  accessibilityLabel={t("colorCapture.cameraButtonLabel")}
  className="absolute items-center justify-center rounded-full bg-elevated"
  style={{ bottom: 96, right: 20, width: 48, height: 48, ... }}
  testID="camera-button"
>
  <SymbolView name="camera" ... />
</Pressable>
```

El `handleCameraPress` se reutiliza — moverlo al `CustomTabBar` o al `ColorsStack` vía prop/context.

---

## 5 · i18n keys

Añadir en `en.json` y `es.json` dentro del namespace `tabs`:

```json
// en.json
"tabs": {
  "colors": "Colors",
  "colorsTab": "Colors tab",
  "favorites": "Favorites",
  "favoritesTab": "Favorites tab",
  "settings": "Settings",
  "camera": "Camera",
  "cameraTab": "Open camera scanner"
}

// es.json
"tabs": {
  "colors": "Colores",
  "colorsTab": "Pestaña de colores",
  "favorites": "Favoritos",
  "favoritesTab": "Pestaña de favoritos",
  "settings": "Ajustes",
  "camera": "Cámara",
  "cameraTab": "Abrir escáner de cámara"
}
```

---

## 6 · Accesibilidad

| Elemento | `accessibilityRole` | `accessibilityLabel` EN | `accessibilityLabel` ES |
|---|---|---|---|
| Camera FAB | `"button"` | `t('tabs.cameraTab')` | `t('tabs.cameraTab')` |
| Colors tab | `"tab"` | `t('tabs.colorsTab')` | `t('tabs.colorsTab')` |
| Favs tab | `"tab"` | `t('tabs.favoritesTab')` | `t('tabs.favoritesTab')` |
| Gear header | `"button"` | `t('tabs.settings')` | `t('tabs.settings')` |

Todos los elementos interactivos deben tener **hit area mínima de 44×44pt**.

---

## 7 · iPad

En iPad el layout del tab bar es horizontal y el cradle no aplica. El `CustomTabBar` detecta `isTablet` y renderiza un tab bar estándar plano con 3 ítems: Colors · Camera · Favorites (en línea).

---

## 8 · Animación del FAB (nice to have)

Al entrar a la pantalla, el FAB puede aparecer con:
```
opacity: 0 → 1  duration: 300ms  delay: 150ms  easing: ease-out
translateY: 8 → 0
```
Respetar `AccessibilityInfo.isReduceMotionEnabled()` — si está activo, sin animación.
