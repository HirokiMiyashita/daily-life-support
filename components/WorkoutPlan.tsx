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
  return (
    <View style={styles.container}>
      {workoutPlan.workout_plan_exercises && workoutPlan.workout_plan_exercises.length > 0 && (
        <View style={styles.exercisesContainer}>
          {workoutPlan.workout_plan_exercises.map((exercisePlan) => {
            const exercise = exercisePlan.exercise_templates;
            const repsText = exercise.target_reps_min === exercise.target_reps_max
              ? `${exercise.target_reps_min}回`
              : `${exercise.target_reps_min}〜${exercise.target_reps_max}回`;
            
            return (
              <View key={exercise.id} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.target_sets}セット × {repsText}
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

