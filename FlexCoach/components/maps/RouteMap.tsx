import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import MapView, { MapStyleElement, Marker, Polyline } from 'react-native-maps';
import { useIsDark, useTheme } from '../../theme';

interface Props {
  points: { lat: number; lon: number }[];
  /** Live: the map follows the newest point. Otherwise it frames the whole route. */
  live?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Room kept clear of the route when framing it (the glass panel over a live map). */
  padding?: { top: number; right: number; bottom: number; left: number };
}

/** Google's map (Android) dimmed to the app's dark ground; Apple's map takes dark mode from userInterfaceStyle. */
const darkStyle = (ground: string, road: string, park: string, label: string): MapStyleElement[] => [
  { elementType: 'geometry', stylers: [{ color: ground }] },
  { elementType: 'labels.text.fill', stylers: [{ color: label }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: ground }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: road }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: park }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: road }] },
];

/**
 * The line marking the path an outdoor run, walk or ride took (v1 #10.8):
 * the route in the accent colour, a green dot where it started and an accent
 * dot at its end (where you are, while live). It never pans or zooms by
 * touch, so a stray tap mid-run can't move it.
 */
export const RouteMap = ({ points, live = false, style, padding }: Props) => {
  const { colors } = useTheme();
  const dark = useIsDark();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => points.map(p => ({ latitude: p.lat, longitude: p.lon })), [points]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  const edge = padding ?? { top: 32, right: 32, bottom: 32, left: 32 };

  useEffect(() => {
    if (!map.current || !last) return;
    if (live) map.current.animateCamera({ center: last, zoom: 16 }, { duration: 600 });
    else if (coords.length > 1) map.current.fitToCoordinates(coords, { edgePadding: edge, animated: false });
    // The camera only needs the newest point while live, and the whole line once otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live ? last?.latitude : coords.length, live ? last?.longitude : 0]);

  if (!first) return <View style={[{ backgroundColor: colors.surface }, style]} />;
  return (
    <MapView
      ref={map}
      style={style}
      initialRegion={{ latitude: last.latitude, longitude: last.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
      showsPointsOfInterests={false}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      customMapStyle={Platform.OS === 'android' && dark ? darkStyle(colors.ground, colors.surfaceRaised, colors.successTint, colors.inkMuted) : undefined}
      onMapReady={() => {
        if (!live && coords.length > 1) map.current?.fitToCoordinates(coords, { edgePadding: edge, animated: false });
      }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Polyline coordinates={coords} strokeColor={colors.accent} strokeWidth={5} lineCap="round" lineJoin="round" />
      <Marker coordinate={first} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.success, borderWidth: 3, borderColor: colors.ground }} />
      </Marker>
      {coords.length > 1 && (
        <Marker coordinate={last} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.ground }} />
        </Marker>
      )}
    </MapView>
  );
};
