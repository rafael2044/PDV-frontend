import { useEffect, useState } from "react";

interface UseScanDetectionProps {
    onScan: (code: string) => void;
    minLength?: number;
}

export default function useScanDetection({ onScan, minLength = 3 }: UseScanDetectionProps) {
    // Buffer para guardar os números digitados rapidamente
    let buffer: string = "";
    let timeout: NodeJS.Timeout | null = null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            // Se o usuário estiver digitando em um input normal (ex: nome do cliente), ignoramos
            // EXCETO se for o campo de busca do PDV (que aceita scan)
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
                const input = target as HTMLInputElement;
                // Se o input não tiver placeholder de scan, ignora
                if (!input.placeholder?.includes("Escanear")) {
                    return;
                }
            }

            // Se for Enter e tivermos algo no buffer, é um scan!
            if (e.key === "Enter") {
                if (buffer.length >= minLength) {
                    e.preventDefault(); // Evita comportamentos padrões
                    onScan(buffer);     // Envia o código lido
                    buffer = "";        // Limpa
                }
                return;
            }

            // Se for um caractere imprimível (número ou letra), adiciona ao buffer
            if (e.key.length === 1) {
                buffer += e.key;

                // Limpa o buffer se demorar muito para digitar o próximo (diferencia humano de máquina)
                // Leitores digitam tudo em milissegundos. Humanos demoram.
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    buffer = "";
                }, 100); // 100ms de tolerância entre teclas
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (timeout) clearTimeout(timeout);
        };
    }, [onScan, minLength]);
}