import { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, TouchableOpacity, Text, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getPrivateFile } from '../api/services';
import { API_BASE_URL } from '../api/client';
import { COLORS, RADIUS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PrivateImageProps {
  fileUrl: string;
  fileName?: string;
  style?: any;
  onPress?: () => void;
}

export default function PrivateImage({ fileUrl, fileName, style, onPress }: PrivateImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!fileUrl) { setError(true); setLoading(false); return; }

    // Extract path from full URL (e.g. https://devai.neoron.co.uk/private/files/x.png → /private/files/x.png)
    let path = fileUrl;
    try {
      if (fileUrl.startsWith('http')) {
        const parsed = new URL(fileUrl);
        path = parsed.pathname;
      }
    } catch {}

    // Public file — use directly
    if (!path.includes('/private/')) {
      const url = path.startsWith('/') ? `${API_BASE_URL}${path}` : fileUrl;
      setSrc(url);
      setLoading(false);
      return;
    }

    // Private file — fetch via API as base64 (send path only, not full URL)
    getPrivateFile(path).then((dataUrl) => {
      if (dataUrl) setSrc(dataUrl);
      else setError(true);
    }).finally(() => setLoading(false));
  }, [fileUrl]);

  const handlePress = () => {
    if (onPress) onPress();
    else if (src) setShowModal(true);
  };

  if (loading) {
    return (
      <View style={[{ backgroundColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm }, style]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !src) {
    return (
      <View
        style={[{ backgroundColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm, gap: 4 }, style]}
      >
        <Feather name="file" size={20} color={COLORS.slate400} />
        {fileName && <Text style={{ fontSize: 9, color: COLORS.slate500 }} numberOfLines={1}>{fileName}</Text>}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Image source={{ uri: src }} style={[{ borderRadius: RADIUS.sm }, style]} resizeMode="cover" />
      </TouchableOpacity>

      {/* Full-screen image modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
            onPress={() => setShowModal(false)}
          >
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          {fileName && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>{fileName}</Text>
          )}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Image
              source={{ uri: src }}
              style={{ width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.7 }}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
