const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const formMessage =
    document.getElementById("formMessage");

const loginButton =
    document.getElementById("loginButton");


loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        formMessage.textContent = "";
        formMessage.className =
            "form-message";

        loginButton.disabled = true;
        loginButton.textContent =
            "Logging In...";


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        const {
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error) {

            formMessage.textContent =
                error.message;

            formMessage.className =
                "form-message error";

            loginButton.disabled = false;
            loginButton.textContent =
                "Log In";

            return;
        }


        formMessage.textContent =
            "Logged in!";

        formMessage.className =
            "form-message success";


        window.location.href =
            "dashboard.html";
    }
);
