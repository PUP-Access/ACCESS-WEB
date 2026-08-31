import dotenv from "dotenv";
import { provisionTestUsers } from "./provision-test-users";

dotenv.config({ path: ".env.local" });

export default async function globalSetup() {
  await provisionTestUsers();
}
