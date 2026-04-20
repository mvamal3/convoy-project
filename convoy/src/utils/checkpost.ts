export const getCheckpostDisplayName = (user: any) => {
  if (!user?.checkpost) return "";

  return user.checkpost === "Sri Vijaya Puram"
    ? "Jirkatang"
    : user.checkpost;
};
