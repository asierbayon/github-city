import axios, { AxiosResponse } from "axios";
import moment from "moment";

// Interfaces
export interface Query {
  query: string;
  variables: {
    LOGIN: string;
    FROM: string;
    TO: string;
  };
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface Week {
  contributionDays: ContributionDay[];
}

export interface UserDetails {
  contributions: ContributionDay[];
  name: string;
}

export interface ResponseOfApi {
  data: {
    user: {
      name: string;
      contributionsCollection: {
        contributionCalendar: {
          weeks: Week[];
        };
      };
    } | null;
  };
}

export class Fetcher {
  constructor(private readonly username: string) {}

  private getGraphQLQuery(from: string, to: string): Query {
    return {
      query: `
        query userInfo($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
          user(login: $LOGIN) {
            name
            contributionsCollection(from: $FROM, to: $TO) {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        LOGIN: this.username,
        FROM: from,
        TO: to,
      },
    };
  }

  private async fetch(
    graphQLQuery: Query
  ): Promise<AxiosResponse<ResponseOfApi>> {
    return axios({
      url: "https://api.github.com/graphql",
      method: "POST",
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      },
      data: graphQLQuery,
    });
  }

  public async fetchContributions(
    days: number,
    customFromDate?: string,
    customToDate?: string
  ): Promise<UserDetails | string> {
    let from = "",
      to = "";
    if (customFromDate && customToDate) {
      from = moment(customFromDate).utc().toISOString(true);
      to = moment(customToDate).utc().toISOString(true);
    } else {
      const now = moment();
      from = moment(now).subtract(days, "days").utc().toISOString();
      to = moment(now).add(1, "days").utc().toISOString();
    }

    try {
      const apiResponse = await this.fetch(this.getGraphQLQuery(from, to));
      if (apiResponse.data.data.user === null) {
        return `Can't fetch any contribution. Please check your username 😬`;
      }

      const userData: UserDetails = {
        contributions: [],
        name: apiResponse.data.data.user.name,
      };

      const weeks =
        apiResponse.data.data.user.contributionsCollection.contributionCalendar
          .weeks;
      console.log("Raw weeks data:", weeks);
      weeks.forEach((week: Week) => {
        week.contributionDays.forEach((contributionDay: ContributionDay) => {
          contributionDay.date = moment(contributionDay.date, moment.ISO_8601)
            .date()
            .toString();
          userData.contributions.push(contributionDay);
        });
      });
      console.log("Processed contributions:", userData.contributions);

      if (!(customFromDate && customToDate)) {
        const length = userData.contributions.length;
        if (userData.contributions[length - 1].contributionCount === 0) {
          userData.contributions.pop();
        }
        const extra = userData.contributions.length - days;
        userData.contributions.splice(0, extra);
      }

      return userData;
    } catch (error) {
      console.error("Error fetching GitHub contributions:", error);
      return "Error fetching GitHub contributions. Please try again later.";
    }
  }
}

// Utility function to validate GitHub username
export const validateGitHubUsername = (username: string): boolean => {
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return githubUsernameRegex.test(username);
};

// Main function to get GitHub contributions
export const getGitHubContributions = async (
  username: string,
  days: number = 365
): Promise<UserDetails | string> => {
  if (!validateGitHubUsername(username)) {
    throw new Error("Invalid GitHub username format");
  }

  const fetcher = new Fetcher(username);
  return fetcher.fetchContributions(days);
};
