import { Logger } from "@leapjs/common";
import { LeapApplication } from "@leapjs/core";
import { ExpressAdapter } from "@leapjs/router";
import { UserController } from "app/user/controller/user";
import ErrorHandler from "common/Handle-Error/error-handler";
import { AuthMiddleware } from "common/middleware/access";
import { AccessTokenGeneratorForRefreshToken } from "common/userSession/controller/userSession";
import { Configuration, configurations } from "configuration/manager";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";


export default async function bootstrap(
	configuration: Configuration,
	listen = true
): Promise<void> {
	const application: LeapApplication = new LeapApplication();

	mongoose.connect(configurations.database.host || "", {
		dbName: configurations.database.name || "",
	  });
  
	  const database = mongoose.connection;
	  database.on("error", (error) => console.error());
	  database.once("connected", () => Logger.log(`Connected to the database`, "LeapApplication"));
  
	const server = application.create(new ExpressAdapter(), {
		prefix: configuration.apiPrefix || "",
		corsOptions: {
			origin: configuration.corsWhitelistedDomains,
			credentials: true
		},
		controllers: [AccessTokenGeneratorForRefreshToken, UserController],
		beforeMiddlewares: [
			helmet(),
			// json(acFilterAttributes),
			AuthMiddleware,
			morgan("dev")
		],
		afterMiddlewares: [ErrorHandler]
	});

	server.listen(configuration.port);
}
