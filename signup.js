const signupForm =
    document.getElementById("signupForm");

const gamertagInput =
    document.getElementById("gamertag");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

const formMessage =
    document.getElementById("formMessage");

const signupButton =
    document.getElementById(
        "signupButton"
    );


signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        formMessage.textContent = "";
        formMessage.className =
            "form-message";


        const gamertag =
            gamertagInput.value.trim();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (
            password !==
            confirmPassword
        ) {

            formMessage.textContent =
                "Passwords do not match.";

            formMessage.className =
                "form-message error";

            return;
        }


        signupButton.disabled = true;
        signupButton.textContent =
            "Creating Account...";


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signUp({
                    email,
                    password
                });


        if (
            error ||
            !data.user
        ) {

            formMessage.textContent =
                error?.message ||
                "Unable to create account.";

            formMessage.className =
                "form-message error";

            signupButton.disabled = false;
            signupButton.textContent =
                "Create Account";

            return;
        }


        const {
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .insert({
                    id:
                        data.user.id,

                    gamertag:
                        gamertag,

                    display_name:
                        gamertag
                });


        if (profileError) {

            formMessage.textContent =
                profileError.message;

            formMessage.className =
                "form-message error";

            signupButton.disabled = false;
            signupButton.textContent =
                "Create Account";

            return;
        }


        formMessage.textContent =
            "Account created!";

        formMessage.className =
            "form-message success";


        window.location.href =
            "dashboard.html";
    }
);
