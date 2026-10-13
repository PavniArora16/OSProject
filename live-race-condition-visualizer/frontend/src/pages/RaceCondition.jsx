import ProblemPage from "./ProblemPage";

export default function RaceCondition() {
  return (
    <ProblemPage
      problem="shared_counter"
      title="Race Condition Visualizer"
      description="Compare concurrent counter updates with and without mutex synchronization."
    />
  );
}