<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\External\GameContentRepository;

/**
 * Content controller — serves game content data.
 * These endpoints are public (behind auth middleware) and read-only.
 */
final class ContentController
{
    public function __construct(
        private readonly GameContentRepository $contentRepo
    ) {}

    /**
     * GET /api/v1/content/skills — returns all skill tree definitions.
     */
    public function getSkills(Request $request, Response $response): void
    {
        try {
            $skills = $this->contentRepo->getAllSkills();
            $response->success($skills, 'Skills loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load skills: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/content/almanac-levels — returns all almanac level definitions.
     */
    public function getAlmanacLevels(Request $request, Response $response): void
    {
        try {
            $levels = $this->contentRepo->getAllAlmanacLevels();
            $response->success($levels, 'Almanac levels loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load almanac levels: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/content/passengers — returns all passenger definitions.
     */
    public function getPassengers(Request $request, Response $response): void
    {
        try {
            $passengers = $this->contentRepo->getAllPassengers();
            $response->success($passengers, 'Passengers loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load passengers: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/content/locations — returns all location definitions.
     */
    public function getLocations(Request $request, Response $response): void
    {
        try {
            $locations = $this->contentRepo->getAllLocations();
            $response->success($locations, 'Locations loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load locations: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/content/rules — returns all shift rule definitions.
     */
    public function getRules(Request $request, Response $response): void
    {
        try {
            $rules = $this->contentRepo->getAllRules();
            $response->success($rules, 'Rules loaded');
        } catch (\Exception $e) {
            $response->error('Failed to load rules: ' . $e->getMessage(), 500);
        }
    }
}
