import { StyleSheet, Text, View } from 'react-native';

type Props = {
  currentStep: number;
  setupMode?: 'AI' | 'SELF' | null;
  steps?: string[];
};

const onboardingSteps = ['作成方法', '基本情報', '確認'];

export function OnboardingStepper({ currentStep, setupMode, steps = onboardingSteps }: Props) {
  return (
    <View style={styles.stepper}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCurrent = currentStep === stepNumber;
        const isSkipped = setupMode === 'SELF' && steps.length === 3 && stepNumber === 2;
        const isDone = stepNumber < currentStep || isSkipped;
        const isActive = isCurrent || isDone;

        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{stepNumber}</Text>
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, (isDone || isCurrent) && styles.stepLineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  stepCircleActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  stepNumber: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 13,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 15,
    left: '62%',
    width: '76%',
    height: 1,
    backgroundColor: '#D1D5DB',
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: '#FF6B35',
  },
});
