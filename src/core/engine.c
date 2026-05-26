#include <stdio.h>
#include <emscripten.h>

// Our shared memory buffer
// 1000 terms * 2 (real + imag)
double result_buffer[2000];

EMSCRIPTEN_KEEPALIVE
double* get_buffer_ptr() {
    return result_buffer;
}

EMSCRIPTEN_KEEPALIVE
void compute_sequence(double r0, double i0, double cr, double ci, int steps) {
    double r = r0;
    double i = i0;

    for (int n = 0; n < steps && n < 1000; n++) {
        result_buffer[n * 2] = r;
        result_buffer[n * 2 + 1] = i;

        // The core math: z = z^2 + c
        double next_r = (r * r) - (i * i) + cr;
        double next_i = (2 * r * i) + ci;

        r = next_r;
        i = next_i;
    }
}