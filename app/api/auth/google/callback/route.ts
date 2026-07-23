import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const OWNER_EMAIL = "cahitberatozcan@gmail.com";

export async function GET(request: NextRequest) {
  try {
    const code =
      request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/login?error=no_code",
          request.url
        )
      );
    }

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET;

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/google/callback";

    if (!clientId) {
      console.error(
        "GOOGLE_CLIENT_ID bulunamadı!"
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=google_client_id",
          request.url
        )
      );
    }

    if (!clientSecret) {
      console.error(
        "GOOGLE_CLIENT_SECRET bulunamadı!"
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=google_client_secret",
          request.url
        )
      );
    }

    console.log(
      "================================="
    );

    console.log(
      "GOOGLE OAUTH CALLBACK"
    );

    console.log(
      "Client ID:",
      clientId
    );

    console.log(
      "Redirect URI:",
      redirectUri
    );

    console.log(
      "Client Secret mevcut: EVET"
    );

    console.log(
      "================================="
    );

    /*
    =====================================
    GOOGLE TOKEN İSTEĞİ
    =====================================
    */

    const tokenResponse =
      await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              code:
                code,

              client_id:
                clientId,

              client_secret:
                clientSecret,

              redirect_uri:
                redirectUri,

              grant_type:
                "authorization_code",
            }),
        }
      );

    /*
    =====================================
    GOOGLE TOKEN HATASI
    =====================================
    */

    if (!tokenResponse.ok) {
      const errorText =
        await tokenResponse.text();

      console.error(
        "================================="
      );

      console.error(
        "GOOGLE TOKEN ERROR:"
      );

      console.error(
        errorText
      );

      console.error(
        "================================="
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=google_token",
          request.url
        )
      );
    }

    const tokens =
      await tokenResponse.json();

    console.log(
      "Google token başarıyla alındı."
    );

    /*
    =====================================
    GOOGLE KULLANICI BİLGİLERİ
    =====================================
    */

    const userResponse =
      await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokens.access_token}`,
          },
        }
      );

    if (!userResponse.ok) {
      const userError =
        await userResponse.text();

      console.error(
        "GOOGLE USER ERROR:",
        userError
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=google_user",
          request.url
        )
      );
    }

    const googleUser =
      await userResponse.json();

    console.log(
      "Google kullanıcı:",
      googleUser.email
    );

    /*
    =====================================
    EMAIL KONTROLÜ
    =====================================
    */

    if (
      !googleUser.email ||
      googleUser.email_verified !== true
    ) {
      console.error(
        "Google email doğrulanmadı."
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=email_not_verified",
          request.url
        )
      );
    }

    const googleEmail =
      googleUser.email
        .trim()
        .toLowerCase();

    /*
    =====================================
    KULLANICIYI BUL
    =====================================
    */

    let user =
      await prisma.user.findUnique({
        where: {
          email:
            googleEmail,
        },
      });

    /*
    =====================================
    YENİ KULLANICI OLUŞTUR
    =====================================
    */

    if (!user) {
      const isOwner =
        googleEmail ===
        OWNER_EMAIL.toLowerCase();

      user =
        await prisma.user.create({
          data: {
            username:
              googleUser.name ||
              googleEmail.split("@")[0],

            email:
              googleEmail,

            password:
              crypto
                .randomBytes(32)
                .toString("hex"),

            role:
              isOwner
                ? "owner"
                : "user",
          },
        });

      console.log(
        "Yeni Google kullanıcısı oluşturuldu:",
        googleEmail
      );
    }

    /*
    =====================================
    OWNER KONTROLÜ
    =====================================
    */

    let activeRole =
      user.role || "user";

    if (
      user.email
        .trim()
        .toLowerCase() ===
      OWNER_EMAIL.toLowerCase()
    ) {
      activeRole =
        "owner";

      if (
        user.role !==
        "owner"
      ) {
        await prisma.user.update({
          where: {
            id:
              user.id,
          },

          data: {
            role:
              "owner",
          },
        });
      }
    }

    /*
    =====================================
    LOGIN VERİSİ
    =====================================
    */

    const userData = {
      id:
        user.id,

      username:
        user.username,

      email:
        user.email,

      role:
        activeRole,
    };

    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    loginUrl.searchParams.set(
      "googleUser",
      JSON.stringify(
        userData
      )
    );

    console.log(
      "Google giriş başarılı:",
      googleEmail
    );

    return NextResponse.redirect(
      loginUrl
    );

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "GOOGLE AUTH ERROR:"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=google_failed",
        request.url
      )
    );
  }
}