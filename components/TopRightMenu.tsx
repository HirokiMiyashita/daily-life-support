import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export function TopRightMenu() {
  const [visible, setVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSigningOut(true);
            const { error } = await supabase.auth.signOut();
            if (error) {
              throw error;
            }
            closeMenu();
            router.replace('/login');
          } catch (error: any) {
            Alert.alert('エラー', error?.message || 'ログアウトに失敗しました');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.iconButton}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="メニューを開く"
      >
        <Text style={styles.iconText}>⋮</Text>
      </Pressable>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.menuCard}>
                <Pressable
                  style={styles.menuItem}
                  onPress={handleLogout}
                  disabled={isSigningOut}
                >
                  <Text style={styles.menuItemText}>
                    {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 72,
    right: 24,
    zIndex: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  iconText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#333',
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuCard: {
    position: 'absolute',
    top: 56,
    right: 12,
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: '600',
  },
});
