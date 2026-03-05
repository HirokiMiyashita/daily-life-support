import { View, Text, StyleSheet } from 'react-native';

interface ExerciseTemplate {
  id: string;
  name: string;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_sets: number | null;
  notes: string | null;
}

interface WorkoutPlanExercise {
  exercise_templates: ExerciseTemplate;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  order_index: number;
}

interface WorkoutPlanProps {
  workoutPlan: {
    name: string;
    cardio_duration_minutes: number | null;
    cardio_type: string | null;
    workout_plan_exercises: WorkoutPlanExercise[];
  };
}

export function WorkoutPlan({ workoutPlan }: WorkoutPlanProps) {
  const orderedExercises = [...(workoutPlan.workout_plan_exercises || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  return (
    <View style={styles.container}>
      {orderedExercises.length > 0 && (
        <View style={styles.exercisesContainer}>
          {orderedExercises.map((exercisePlan) => {
            const exercise = exercisePlan.exercise_templates;
            const targetSets = exercisePlan.target_sets ?? exercise.target_sets;
            const targetRepsMin = exercisePlan.target_reps_min ?? exercise.target_reps_min;
            const targetRepsMax = exercisePlan.target_reps_max ?? exercise.target_reps_max;
            const repsText = targetRepsMin === targetRepsMax
              ? `${targetRepsMin ?? '-'}回`
              : `${targetRepsMin ?? '-'}〜${targetRepsMax ?? '-'}回`;
            
            return (
              <View key={`${exercise.id}-${exercisePlan.order_index}`} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {targetSets ?? '-'}セット × {repsText}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {workoutPlan.cardio_duration_minutes && (
        <View style={styles.cardioSection}>
          <Text style={styles.exerciseName}>有酸素運動</Text>
          <Text style={styles.exerciseDetails}>
            1セット × {workoutPlan.cardio_duration_minutes}分
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  exercisesContainer: {
    gap: 12,
  },
  exerciseItem: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
  },
  cardioSection: {
    gap: 4,
    marginTop: 4,
  },
});

