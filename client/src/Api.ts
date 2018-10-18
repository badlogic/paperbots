export type ErrorType = "InvalidArgument" | "InvalidEmailAddress" | "InvalidUserName" | "ServerError" | "UserDoesNotExist" | "UserExists" | "EmailExists" | "CouldNotCreateUser" | "CouldNotSendEmail" | "CouldNotCreateCode" | "CouldNotVerifyCode";

export interface RequestError {
	error: ErrorType
}

export interface NameAndToken {
	name: string,
	token: string
}

export class Api {
	private static request <Data, Response>(endpoint: string, data: Data, success: (r: Response) => void, error: (e: RequestError) => void) {
		$.ajax({
			url: endpoint,
			method: "POST",
			contentType: "application/json",
			processData: false,
			data: JSON.stringify(data)
		})
		.done((response) => {
			success(response as Response);
		}).fail((e) => {
			console.log(e);
			if (e.responseJSON)
				error(e.responseJSON as RequestError);
			else
				error({ error: "ServerError" });
		});
	}

	public static signup(email: string, name: string,  success: () => void, error: (e: RequestError) => void) {
		this.request("api/signup", { email: email, name: name },
		(r: { name: string, token: string }) => {
			success();
		}, (e: RequestError) => {
			error(e);
		});
	}

	public static login(emailOrUser: string, success: () => void, error: (userDoesNotExist: boolean) => void) {
		this.request("api/login", { email: emailOrUser },
		(r: { name: string, token: string }) => {
			success();
		}, (e: RequestError) => {
			error(e.error == "UserDoesNotExist");
		});
	}

	public static verify(code: string, success: (NameAndtoken) => void, error: (invalidCode: boolean) => void) {
		this.request("api/verify", { code: code },
		(r: NameAndToken) => {
			success(r);
		}, (e: RequestError) => {
			error(e.error == "CouldNotVerifyCode");
		});
	}
}