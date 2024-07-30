const { getThreads, getThreadStatus } = require("../../world/threadManager");
const v8 = require("node:v8");

const MEMORY_DISPLAY_NAMES = {
	total_heap_size: "Total"
	, total_heap_size_executable: "Executable"
	, total_physical_size: "Physical"
	, total_available_size: "Available"
	, used_heap_size: "Used"
	, heap_size_limit: "Limit"
	, malloced_memory: "Malloced"
	, peak_malloced_memory: "Peak"

	, external_memory: "External"
	, externally_allocated_size: "Externally Allocated"
};

const formatMetrics = (rawMetrics) => {
	const cleanedMetrics = {};
	if (rawMetrics.playerCount) {
		cleanedMetrics["PlayerCount"] = rawMetrics.playerCount;
	}
	const heapStatistics = rawMetrics.heapStatistics;
	if (heapStatistics) {
		const memoryMetrics = {};
		for (const heapKey in heapStatistics) {
			const newName = MEMORY_DISPLAY_NAMES[heapKey];
			if (newName) {
				// Convert from Bytes to MB while changing the name.
				memoryMetrics[newName] = (heapStatistics[heapKey] / 1048576).toFixed(2);
			}
		}
		cleanedMetrics["Memory"] = memoryMetrics;
		cleanedMetrics["Global Handles"] = {
			"Used": heapStatistics.used_global_handles_size
			, "Total": heapStatistics.total_global_handles_size
		};
		if (heapStatistics.number_of_native_contexts > 1) {
			cleanedMetrics["Native Contexts"] = heapStatistics.number_of_native_contexts;
		}
		if (heapStatistics.number_of_detached_contexts > 0) {
			cleanedMetrics["Detached Contexts"] = heapStatistics.number_of_detached_contexts;
		}
	}
	return cleanedMetrics;
};

module.exports = {
	get: async (req, res) => {
		const threadsMetrics = {};
		for (const thread of getThreads()) {
			const metrics = await getThreadStatus(thread, true);
			threadsMetrics[thread.id] = formatMetrics(metrics);
		}
		threadsMetrics["MainThread"] = formatMetrics({
			playerCount: cons.players.length
			, heapStatistics: v8.getHeapStatistics()
		});
		res.json(threadsMetrics);
	}
};
