<?php
namespace App\Http\Controllers\Api\V1; use App\Http\Controllers\Controller; use App\Http\Requests\Activation\ActivateRequest; use App\Http\Resources\ActivationResource; use App\Services\ActivationService; use Illuminate\Http\JsonResponse;
final class ActivationController extends Controller { public function __invoke(ActivateRequest $request,ActivationService $service): ActivationResource|JsonResponse { $result=$service->activate($request->validated(),$request->ip()); return new ActivationResource($result); } }
