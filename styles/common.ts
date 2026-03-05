export const colors = {
  background: '#f5f5f5',
  cardBackground: '#fff',
  textPrimary: '#000',
  textSecondary: '#666',
  textMuted: '#777',
  borderMuted: '#e0e0e0',
  borderInput: '#D1D5DB',
  accent: '#FF6B35',
  accentSoft: '#FFF3EE',
  darkButton: '#111827',
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

export const commonStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    ...shadows.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  choiceButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  choiceText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500' as const,
  },
  choiceTextActive: {
    color: colors.accent,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontWeight: '600' as const,
  },
  buttonDark: {
    backgroundColor: colors.darkButton,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  buttonDarkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  footerRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
} as const;
