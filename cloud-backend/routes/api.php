<?php
use App\Http\Controllers\Api\V1\ActivationController; use Illuminate\Support\Facades\Route;
Route::prefix('v1')->middleware(['throttle:activation'])->group(function(){ Route::post('/activation',ActivationController::class)->name('activation.store'); });
