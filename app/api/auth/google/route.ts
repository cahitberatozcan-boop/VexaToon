import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/google/callback";

    if (!clientId) {
      console.error(
        "GOOGLE_CLIENT_ID bulunamadı!"
      );

      return NextResponse.json(
        {
          message:
            "GOOGLE_CLIENT_ID .env dosyasında bulunamadı.",
        },
        {
          status: 500,
        }
      );
    }

    const googleUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId,

        redirect_uri:
          redirectUri,

        response_type: "code",

        scope:
          "openid email profile",

        access_type: "offline",

        prompt:
          "select_account",
      }).toString();

    console.log(
      "Google OAuth başlatılıyor..."
    );

    console.log(
      "Redirect URI:",
      redirectUri
    );

    return NextResponse.redirect(
      googleUrl
    );

  } catch (error) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Google giriş başlatılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}