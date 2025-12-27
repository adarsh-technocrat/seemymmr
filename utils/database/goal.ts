import connectDB from "@/db";
import Goal from "@/db/models/Goal";
import GoalEvent from "@/db/models/GoalEvent";

/**
 * Get all goals for a website
 */
export async function getGoalsByWebsiteId(websiteId: string) {
  await connectDB();

  try {
    const goals = await Goal.find({ websiteId }).sort({ createdAt: -1 });
    return goals;
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
}

/**
 * Get goal by ID
 */
export async function getGoalById(goalId: string) {
  await connectDB();

  try {
    const goal = await Goal.findById(goalId);
    return goal;
  } catch (error) {
    console.error("Error fetching goal:", error);
    throw error;
  }
}

/**
 * Create a new goal
 */
export async function createGoal(data: {
  websiteId: string;
  name: string;
  event: string;
  description?: string;
}) {
  await connectDB();

  try {
    const goal = new Goal({
      websiteId: data.websiteId,
      name: data.name,
      event: data.event,
      description: data.description,
    });

    await goal.save();
    return goal;
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
}

/**
 * Update goal
 */
export async function updateGoal(
  goalId: string,
  updates: {
    name?: string;
    event?: string;
    description?: string;
  }
) {
  await connectDB();

  try {
    const goal = await Goal.findByIdAndUpdate(
      goalId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return goal;
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
}

/**
 * Delete goal
 */
export async function deleteGoal(goalId: string) {
  await connectDB();

  try {
    await Goal.findByIdAndDelete(goalId);
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
}

/**
 * Track a goal event
 */
export async function trackGoalEvent(data: {
  websiteId: string;
  event: string;
  sessionId?: string;
  visitorId?: string;
  path?: string;
  value?: number;
  customData?: Record<string, any>;
}) {
  await connectDB();

  try {
    // Find goal by event name
    const goal = await Goal.findOne({
      websiteId: data.websiteId,
      event: data.event,
    });

    if (!goal) {
      // Goal not found, but we can still track it
      console.warn(`Goal not found for event: ${data.event}`);
      return null;
    }

    const goalEvent = new GoalEvent({
      websiteId: data.websiteId,
      goalId: goal._id,
      sessionId: data.sessionId || "unknown",
      visitorId: data.visitorId || "unknown",
      path: data.path || "/",
      value: data.value,
      customData: data.customData || {},
      timestamp: new Date(),
    });

    await goalEvent.save();
    return goalEvent;
  } catch (error) {
    console.error("Error tracking goal event:", error);
    throw error;
  }
}
