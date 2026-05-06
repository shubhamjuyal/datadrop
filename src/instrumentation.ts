export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { connect } = await import("@/lib/server/db");
    await connect();
  }
}
