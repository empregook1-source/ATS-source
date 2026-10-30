<script setup lang="ts">
import { Eye, EyeOff } from "lucide-vue-next";

definePageMeta({
    layout: "auth",
    middleware: ["guest"],
});

useSeoMeta({
    title: "Login — Emprego OK",
    description: "Faça login na sua conta Emprego OK",
    robots: "noindex, nofollow",
});

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const showPassword = ref(false);
const route = useRoute();
const localePath = useLocalePath();
const { track } = useTrack();
const allowPublicSignUp = ref(false);
const pendingInvitation = computed(
    () => route.query.invitation as string | undefined,
);
const signUpLink = computed(() =>
    pendingInvitation.value
        ? `${localePath("/auth/sign-up")}?invitation=${encodeURIComponent(
              pendingInvitation.value,
          )}`
        : localePath("/auth/sign-up"),
);

onMounted(() => track("signin_page_viewed"));

onMounted(async () => {
    try {
        const status = await $fetch<{ allowPublicSignUp: boolean }>(
            "/api/bootstrap/status",
        );
        allowPublicSignUp.value = status.allowPublicSignUp;
    } catch {
        allowPublicSignUp.value = false;
    }
});

async function handleSignIn() {
    error.value = "";

    if (!email.value || !password.value) {
        error.value = "Email e senha são obrigatórios.";
        return;
    }

    isLoading.value = true;

    let result: Awaited<ReturnType<typeof authClient.signIn.email>>;
    try {
        result = await authClient.signIn.email({
            email: email.value,
            password: password.value,
        });
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Sign-in failed. Please try again.";
        isLoading.value = false;
        return;
    }

    if (result.error) {
        if (result.error.status === 500) {
            error.value =
                result.error.message && result.error.message !== "Server Error"
                    ? result.error.message
                    : 'Sign-in failed due to a server error. If you are self-hosting, make sure the BETTER_AUTH_URL environment variable is set to your deployment domain (e.g. "https://your-app.up.railway.app") and redeploy.';
        } else {
            error.value =
                result.error.message ??
                "Invalid credentials. Please try again.";
        }
        isLoading.value = false;
        return;
    }

    clearNuxtData();
    track("signin_completed");

    const pendingInvitation = route.query.invitation as string | undefined;
    if (pendingInvitation) {
        await navigateTo(
            localePath(`/auth/accept-invitation/${pendingInvitation}`),
        );
    } else {
        await navigateTo(localePath("/dashboard"));
    }
}
</script>

<template>
    <form class="flex flex-col gap-4" @submit.prevent="handleSignIn">
        <h2
            class="text-xl font-semibold text-center text-surface-900 dark:text-surface-100 mb-2"
        >
            Faça login na sua conta
        </h2>

        <div
            v-if="error"
            class="rounded-md border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-3 text-sm text-danger-700 dark:text-danger-400"
        >
            {{ error }}
        </div>

        <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
        >
            <span>Email</span>
            <input
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
        </label>

        <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
        >
            <span>Password</span>
            <div class="relative">
                <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    class="w-full px-3 py-2 pr-10 border border-surface-300 dark:border-surface-700 rounded-md text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
                <button
                    type="button"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    :aria-pressed="showPassword"
                    @click="showPassword = !showPassword"
                >
                    <EyeOff v-if="showPassword" class="size-4" />
                    <Eye v-else class="size-4" />
                </button>
            </div>
        </label>

        <button
            type="submit"
            :disabled="isLoading"
            class="mt-2 px-4 py-2.5 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
            {{ isLoading ? "Entrando…" : "Entrar" }}
        </button>

        <p
            v-if="allowPublicSignUp"
            class="text-center text-sm text-surface-500 dark:text-surface-400"
        >
            Ainda não tem conta?
            <NuxtLink
                :to="signUpLink"
                class="text-brand-600 dark:text-brand-400 hover:underline"
                >Criar conta</NuxtLink
            >
        </p>
    </form>
</template>
