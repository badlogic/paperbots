export type ErrorType = "InvalidArgument" | "InvalidEmailAddress" | "InvalidUserName" | "ServerError" | "UserDoesNotExist" | "ProjectDoesNotExist" | "UserExists" | "EmailExists" | "CouldNotCreateUser" | "CouldNotSendEmail" | "CouldNotCreateCode" | "CouldNotVerifyCode" | "CouldNotSaveProject";

export interface RequestError {
	error: ErrorType
}

export type ProjectType = "robot" | "canvas";

export interface Project {
	code: string
	userName: string
	title: string
	description: string
	content: string
	contentObject: any
	created: string
	lastModified: string
	public: boolean
	type: ProjectType
}

export class Api {

	private static request <Data, Response>(endpoint: string, data: Data, success: (r: Response) => void, error: (e: RequestError) => void) {
		$.ajax({
			url: endpoint,
			method: "POST",
			contentType: "application/json; charset=utf-8",
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

	public static verify(code: string, success: () => void, error: (invalidCode: boolean) => void) {
		this.request("api/verify", { code: code },
		() => {
			success();
		}, (e: RequestError) => {
			error(e.error == "CouldNotVerifyCode");
		});
	}

	public static logout(success: () => void, error: () => void) {
		this.request("api/logout", { },
		( ) => {
			success();
		}, (e: RequestError) => {
			error();
		});
	}

	public static loadProject(projectId: string, success: (project: Project) => void, error: (e: RequestError) => void) {
		this.request("api/getproject", { projectId: projectId },
		(project: Project) => {
			try {
				project.contentObject = JSON.parse(project.content);
			} catch (e) {
				console.log(e);
				error({error: "ServerError"});
			}
			success(project);
		}, (e: RequestError) => {
			error(e);
		});
	}

	static saveProject(project: Project, success: (id: string) => void, error: (error: RequestError) => void): any {
		this.request("api/saveproject", project,
		(r: {projectId: string}) => {
			success(r.projectId);
		}, (e: RequestError) => {
			error(e);
		});
	}

	static getUserProjects (userName: string, success: (projects: Array<Project>) => void, error: (error: RequestError) => void) {
		this.request("api/getprojects", { userName: Api.getUserName() },
		(projects: Array<Project>) => {
			success(projects);
		}, (e: RequestError) => {
			error(e);
		});
	}

	public static getUserName() {
		return this.getCookie("name");
	}

	public static getProjectId() {
		return this.getUrlParameter("id");
	}

	public static getUserId() {
		return this.getUrlParameter("id");
	}

	public static getUrlParameter(name) {
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(location.search);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	static getCookie (key) {
		if (!key) { return null; }
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	}

	static getUserUrl(name: string) {
		return "/user.html?id=" + name;
	}

	static getProjectUrl(name: string) {
		return "/project.html?id=" + name;
	}
}