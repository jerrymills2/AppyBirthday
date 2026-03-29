import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

export const scheduleBirthdayReminder = async (profile) => {
  if (!profile.birthday) return;

  const [m, d] = profile.birthday.split("-").map(Number);
  const today = new Date();
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next.setFullYear(today.getFullYear() + 1);

  const sevenDaysBefore = new Date(next);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

  if (sevenDaysBefore > today) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎂 ${profile.name}'s birthday is in 7 days!`,
        body: "Open Appy Birthday to write a letter or plan a gift.",
        data: { profileId: profile.id },
      },
      trigger: { date: sevenDaysBefore },
    });
  }

  const oneDayBefore = new Date(next);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  if (oneDayBefore > today) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎂 ${profile.name}'s birthday is TOMORROW!`,
        body: "Don't forget to reach out!",
        data: { profileId: profile.id },
      },
      trigger: { date: oneDayBefore },
    });
  }

  // Day-of notification
  if (next > today) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 Today is ${profile.name}'s birthday!`,
        body: "Send a message, letter, or gift today!",
        data: { profileId: profile.id },
      },
      trigger: { date: next },
    });
  }
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const rescheduleAllNotifications = async (profiles) => {
  await cancelAllNotifications();
  for (const p of profiles) {
    await scheduleBirthdayReminder(p);
  }
};
