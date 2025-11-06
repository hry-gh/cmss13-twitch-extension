import { useEffect, useState } from "react";

type Mob = {
  name: string;
  job: string;
  background: string;
};

type Auth = {
  token: string;
  userId: string;
};

function App() {
  const [mobs, setMobs] = useState<Mob[]>();
  const [viewerAuth, setViewerAuth] = useState<Auth>();
  const [response, setResponse] = useState<string>();
  const [icons, setIcons] = useState<{ [key: string]: string }>();

  useEffect(() => {
    let localAuth: undefined | Auth;

    if (!window.Twitch) {
      return;
    }

    window.Twitch.ext.onAuthorized((auth: Auth) => {
      setViewerAuth(auth);
      localAuth = auth;
    });

    setTimeout(() => {
      if (!window.Twitch) {
        return;
      }

      if (localAuth) {
        const base64Url = localAuth.token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map((c) => {
              return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
            })
            .join("")
        );

        const obj = JSON.parse(jsonPayload);

        if (!obj.user_id) {
          window.Twitch.ext.actions.requestIdShare();
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    const getMobs = () => {
      fetch("https://twitch.cm-ss13.com/active_players").then((fetched) =>
        fetched
          .json()
          .then((json) => {
            setMobs(json);
          })
          .finally(() => {
            setTimeout(getMobs, 5000);
          })
      );
    };

    fetch("https://twitch.cm-ss13.com/role_icons").then((fetched) => {
      fetched.json().then((json) => {
        setIcons(json);
        getMobs();
      });
    });
  }, []);

  return (
    <>
      <div
        style={{ width: "100%", height: "100%", position: "absolute" }}
        className="crt"
      ></div>
      <div className="p-2 flex flex-col justify-center h-full">
        <div className="section overflow-scroll">
          <div className="text text-lg font-black">Available Players</div>
          <div className="divider"></div>
          <div className="flex flex-col gap-1.5">
            {mobs?.map((mob) => (
              <button
                type="button"
                key={mob.name}
                className="text flex justify-center"
                onClick={() => {
                  fetch("https://twitch.cm-ss13.com/follow_player", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: mob.name,
                      token: viewerAuth?.token,
                    }),
                  }).then((response) =>
                    response.text().then((text) => {
                      setResponse(text);
                      setTimeout(() => setResponse(undefined), 5000);
                    })
                  );
                }}
              >
                <div className="rounded flex flex-row grow justify-center p-1 button gap-1">
                  {icons && (
                    <div
                      style={{ width: "16px", height: "16px" }}
                      className="icon"
                    >
                      <img
                        src={`data:image/jpeg;base64,${icons[mob.background]}`}
                        alt={mob.job}
                        style={{
                          imageRendering: "pixelated",
                          width: "16px",
                          height: "16px",
                          marginRight: "4px",
                          position: "relative",
                        }}
                      ></img>
                      <img
                        src={`data:image/jpeg;base64,${icons[mob.job]}`}
                        alt={mob.job}
                        style={{
                          imageRendering: "pixelated",
                          width: "16px",
                          height: "16px",
                          marginRight: "4px",
                          position: "relative",
                          top: "-16px",
                        }}
                      ></img>
                    </div>
                  )}
                  <div key={mob.name} className="cursor-pointer">
                    {mob.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {!!response && <div className="pt-3 font-bold text">{response}</div>}
        </div>
      </div>
    </>
  );
}

export default App;
